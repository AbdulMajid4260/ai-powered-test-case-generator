
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

from schemas import TestCase

load_dotenv(Path(__file__).with_name(".env"), override=True)

MODEL_NAME = "openai/gpt-oss-120b"
MIN_TEST_CASES = 5
MAX_TEST_CASES = 10


def generate_test_cases(requirement: str) -> list[TestCase]:
    """Generate and validate 5 to 10 test cases using Groq."""

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not api_key.strip():
        raise RuntimeError("Groq API key is not configured.")

    client = Groq(api_key=api_key.strip())

    prompt = f"""
You are an experienced software test engineer.

Analyze this software requirement:
{requirement}

Generate between {MIN_TEST_CASES} and {MAX_TEST_CASES} distinct test cases.

Requirements:
- Include positive and negative cases where relevant.
- Give each test case a unique ID, such as TC001.
- Include preconditions and actionable test steps.
- Give each case a specific expected result.
- Priority must be High, Medium, or Low.
- Test type must be Positive or Negative.
- Do not invent unrelated features.
- Return JSON only, using this structure:
{{
  "test_cases": [
    {{
      "test_case_id": "TC001",
      "title": "Example title",
      "preconditions": ["Example precondition"],
      "test_steps": ["Step 1", "Step 2"],
      "expected_result": "Expected outcome",
      "priority": "High",
      "test_type": "Positive"
    }}
  ]
}}
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You generate software test cases. "
                    "Follow the requested JSON structure exactly."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Groq returned an empty response.")

    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError("Groq returned invalid JSON.") from exc

    if not isinstance(data, dict):
        raise ValueError("Groq response must be a JSON object.")

    raw_cases = data.get("test_cases")
    if not isinstance(raw_cases, list):
        raise ValueError("Groq response is missing the test_cases list.")

    if not MIN_TEST_CASES <= len(raw_cases) <= MAX_TEST_CASES:
        raise ValueError(
            f"Groq must return {MIN_TEST_CASES} to "
            f"{MAX_TEST_CASES} test cases."
        )

    test_cases = [TestCase.model_validate(item) for item in raw_cases]

    ids = [case.test_case_id for case in test_cases]
    if len(ids) != len(set(ids)):
        raise ValueError("Groq returned duplicate test-case IDs.")

    return test_cases
