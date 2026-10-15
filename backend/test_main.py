import pytest
from fastapi.testclient import TestClient

import main
from schemas import TestCase

client = TestClient(main.app)


def make_cases(count=5):
    return [
        TestCase(
            test_case_id=f"TC{i:03}",
            title=f"Test case {i}",
            preconditions=["A test user exists"],
            test_steps=["Open the application", "Perform the test action"],
            expected_result=f"Expected result {i}",
            priority="High" if i == 1 else "Medium",
            test_type="Positive" if i % 2 else "Negative",
        )
        for i in range(1, count + 1)
    ]


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_empty_requirement_is_rejected():
    response = client.post(
        "/api/generate-test-cases",
        json={"requirement": "   "},
    )
    assert response.status_code == 422


def test_missing_requirement_is_rejected():
    response = client.post("/api/generate-test-cases", json={})
    assert response.status_code == 422


def test_unknown_request_field_is_rejected():
    response = client.post(
        "/api/generate-test-cases",
        json={
            "requirement": "Users can log in.",
            "extra_field": "unexpected",
        },
    )
    assert response.status_code == 422


def test_generation_returns_at_least_five_cases(monkeypatch):
    monkeypatch.setattr(
        main,
        "generate_test_cases",
        lambda requirement: make_cases(5),
    )

    response = client.post(
        "/api/generate-test-cases",
        json={"requirement": "Users can log in."},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["test_cases"]) == 5
    assert body["generation_id"]


def test_generation_failure_returns_502(monkeypatch):
    def fail_generation(requirement):
        raise RuntimeError("Simulated provider failure")

    monkeypatch.setattr(main, "generate_test_cases", fail_generation)

    response = client.post(
        "/api/generate-test-cases",
        json={"requirement": "Users can log in."},
    )

    assert response.status_code == 502


def test_excel_export_uses_backend_results(monkeypatch):
    monkeypatch.setattr(
        main,
        "generate_test_cases",
        lambda requirement: make_cases(5),
    )

    generated = client.post(
        "/api/generate-test-cases",
        json={"requirement": "Users can log in."},
    )
    assert generated.status_code == 200

    generation_id = generated.json()["generation_id"]
    exported = client.get(f"/api/export/{generation_id}")

    assert exported.status_code == 200
    assert "spreadsheetml.sheet" in exported.headers["content-type"]
    assert exported.content[:2] == b"PK"


def test_unknown_export_id_returns_404():
    response = client.get("/api/export/not-a-real-id")
    assert response.status_code == 404



@pytest.fixture
def isolated_database(tmp_path, monkeypatch):
    """Give each new test its own temporary SQLite database."""
    monkeypatch.setattr(
        main,
        "DATABASE_PATH",
        tmp_path / "test_cases.db",
    )
    main.init_db()


def test_history_lists_saved_generations(isolated_database, monkeypatch):
    monkeypatch.setattr(
        main,
        "generate_test_cases",
        lambda requirement: make_cases(5),
    )

    generated = client.post(
        "/api/generate-test-cases",
        json={"requirement": "Users can log in."},
    )
    assert generated.status_code == 200
    generation_id = generated.json()["generation_id"]

    response = client.get("/api/history")

    assert response.status_code == 200
    items = response.json()["items"]
    saved_item = next(
        item for item in items if item["id"] == generation_id
    )

    assert saved_item["requirement"] == "Users can log in."
    assert saved_item["test_case_count"] == 5
    assert saved_item["positive_count"] == 3
    assert saved_item["negative_count"] == 2


def test_history_returns_saved_test_cases(isolated_database, monkeypatch):
    monkeypatch.setattr(
        main,
        "generate_test_cases",
        lambda requirement: make_cases(5),
    )

    generated = client.post(
        "/api/generate-test-cases",
        json={"requirement": "Users can log in."},
    )
    generation_id = generated.json()["generation_id"]

    response = client.get(f"/api/history/{generation_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == generation_id
    assert body["requirement"] == "Users can log in."
    assert len(body["test_cases"]) == 5
    assert body["test_cases"][0]["test_case_id"] == "TC001"


def test_delete_history_removes_saved_generation(
    isolated_database,
    monkeypatch,
):
    monkeypatch.setattr(
        main,
        "generate_test_cases",
        lambda requirement: make_cases(5),
    )

    generated = client.post(
        "/api/generate-test-cases",
        json={"requirement": "Users can log in."},
    )
    generation_id = generated.json()["generation_id"]

    deleted = client.delete(f"/api/history/{generation_id}")

    assert deleted.status_code == 204
    assert client.get(f"/api/history/{generation_id}").status_code == 404


@pytest.mark.parametrize(
    ("export_format", "expected_content_type", "expected_content"),
    [
        ("csv", "text/csv", b"Test Case ID"),
        ("json", "application/json", b'"test_case_id": "TC001"'),
    ],
)
def test_csv_and_json_exports(
    isolated_database,
    monkeypatch,
    export_format,
    expected_content_type,
    expected_content,
):
    monkeypatch.setattr(
        main,
        "generate_test_cases",
        lambda requirement: make_cases(5),
    )

    generated = client.post(
        "/api/generate-test-cases",
        json={"requirement": "Users can log in."},
    )
    assert generated.status_code == 200
    generation_id = generated.json()["generation_id"]

    response = client.get(
        f"/api/export/{generation_id}",
        params={"format": export_format},
    )

    assert response.status_code == 200
    assert expected_content_type in response.headers["content-type"]
    assert expected_content in response.content
    assert f"test_cases_{generation_id}.{export_format}" in (
        response.headers["content-disposition"]
    )
