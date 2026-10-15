
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
