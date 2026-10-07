import json
import sqlite3
import os
import sys
import io

# Force UTF-8 stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))


from main import app
from app.database import DATABASE_URL
from fastapi.testclient import TestClient

client = TestClient(app)

# Load benchmark expected results
with open("benchmark_expected.json", "r", encoding="utf-8") as f:
    test_cases = json.load(f)

print("=" * 80)
print("TESTING FASTAPI POST /api/calculate WITH TESTCLIENT & SQLITE VERIFICATION")
print("=" * 80)

# Connect to SQLite to count logs
db_file = os.path.join("backend", "solar_era.db")
conn = sqlite3.connect(db_file)
cur = conn.cursor()
initial_count = cur.execute("SELECT count(*) FROM calculation_logs").fetchone()[0]

all_passed = True

for idx, tc in enumerate(test_cases, 1):
    response = client.post("/api/calculate", json=tc["input"])
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}: {response.text}"
    
    backend_result = response.json()
    frontend_result = tc["result"]
    
    mismatches = []
    for k, expected_val in frontend_result.items():
        actual_val = backend_result.get(k)
        if actual_val != expected_val:
            mismatches.append((k, expected_val, actual_val))
            
    print(f"\n[Test Case {idx}] {tc['name']}")
    if not mismatches:
        print(f"  STATUS: PASSED (100% Match on all {len(frontend_result)} metrics)")
        print(f"  - Recommended Capacity: {backend_result['recommendedCapacityKw']} kW")
        print(f"  - Total System Cost:    Rs. {backend_result['totalSystemCost']:,.0f}")
        print(f"  - Central Subsidy:      Rs. {backend_result['centralSubsidy']:,.0f}")
        print(f"  - State Subsidy:        Rs. {backend_result['stateSubsidy']:,.0f}")
        print(f"  - Net Out-of-Pocket:    Rs. {backend_result['netPayableCost']:,.0f}")
        print(f"  - Monthly Savings:      Rs. {backend_result['monthlySavings']:,.0f}")
        print(f"  - Annual Savings:       Rs. {backend_result['annualSavings']:,.0f}")
        print(f"  - 25-Year Savings:      Rs. {backend_result['twentyFiveYearSavings']:,.0f}")
        print(f"  - Payback Period:       {backend_result['paybackPeriodYears']} Years")
        print(f"  - SBI Loan EMI:         Rs. {backend_result['sbiLoanEmiEstimate']:,.0f}/month")
        print(f"  - CO2 Annual Offset:    {backend_result['co2AnnualOffsetKg']:,.0f} kg ({backend_result['treesEquivalentAnnual']} trees)")
        print(f"  - Saved Log ID in DB:   {backend_result.get('logId')}")
    else:
        all_passed = False
        print(f"  STATUS: FAILED with {len(mismatches)} mismatches:")
        for k, exp, act in mismatches:
            print(f"    * {k}: expected {exp}, got {act}")

final_count = cur.execute("SELECT count(*) FROM calculation_logs").fetchone()[0]
conn.close()

print("\n" + "=" * 80)
print(f"SQLite calculation_logs: Started with {initial_count} rows, now has {final_count} rows.")
print(f"New rows created: {final_count - initial_count}")
print("=" * 80)

if all_passed and (final_count - initial_count == len(test_cases)):
    print("ALL 3 TEST CASES PROVEN 100% IDENTICAL AND STORED IN SQLITE!")
    sys.exit(0)
else:
    print("TEST FAILED")
    sys.exit(1)
