import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read())

def get(url):
    return json.loads(urllib.request.urlopen(url).read())

print("--- STARTING COMPLETE SIMULATION FLOW TEST ---")

# Step 0: Ensure Clean Demo State
reset_start = post('http://localhost:8000/api/demo/reset', {})
print(f"0. Initialized clean demo state: {reset_start['message']}")

# Step 1: Compare Corridors
comp = post('http://localhost:8000/api/remittance/compare', {'amount': 10000, 'deadline': '2026-10-10'})
print(f"1. Compared Corridors: {len(comp['options'])} options returned.")
for opt in comp['options']:
    print(f"   - {opt['name']}: Fee=Rs.{opt['fee']}, Speed={opt['speed_days']}d, Recipient Est=${opt['estimated_recipient_amount']}, Badges={opt['badges']}")

# Step 2: Create Send Draft
draft = post('http://localhost:8000/api/drafts', {'user_id': 1, 'corridor_id': 1, 'amount': 10000, 'deadline': '2026-10-10'})
draft_id = draft['id']
print(f"2. Created Draft #{draft_id}: Status={draft['status']}, Window={draft['suggested_window_display']}, Total to deduct=Rs.{draft['total_deducted']}")

# Step 3: Approve Draft
appr = post(f"http://localhost:8000/api/drafts/{draft_id}/approve", {})
print(f"3. Approved Draft #{draft_id}: Status={appr['status']}, ApprovedAt={appr['approved_at']}")

# Step 4: Verify Dashboard Balance
dash = get('http://localhost:8000/api/dashboard/1')
print(f"4. Updated Dashboard: Available Balance=Rs.{dash['available_balance']}, Goal Reserved=Rs.{dash['goal_reserved']}")
assert dash['available_balance'] == 9850.0, f"Expected 9850.0, got {dash['available_balance']}"

# Step 5: Park Leftover to Goal
goals = get('http://localhost:8000/api/goals/1')
exam_goal = next(g for g in goals if g['name'] == 'Exam Fee')
print(f"5. Goal before allocation: {exam_goal['name']} (Saved: Rs.{exam_goal['saved_amount']} / Target: Rs.{exam_goal['target_amount']})")

alloc = post(f"http://localhost:8000/api/goals/{exam_goal['id']}/allocate", {'user_id': 1, 'amount': 3000})
print(f"   Allocated Rs.3000: {alloc['message']}")
print(f"   Goal after: Saved=Rs.{alloc['goal']['saved_amount']}, Status={alloc['goal']['status']}, Progress={alloc['goal']['progress_percentage']}%")
assert alloc['goal']['saved_amount'] == 5000.0
assert alloc['updated_balance'] == 6850.0

# Step 6: Verify Activity Log
activity = get('http://localhost:8000/api/activity/1')
print(f"6. Activity Logs ({len(activity)} entries):")
for a in activity[:4]:
    print(f"   * [{a['action']}] {a['description']}")

# Step 7: Reset Demo
reset_res = post('http://localhost:8000/api/demo/reset', {})
print(f"7. Reset Demo: {reset_res['message']}")
dash_reset = get('http://localhost:8000/api/dashboard/1')
print(f"   Reset Available Balance: Rs.{dash_reset['available_balance']}, Simulated Transfers: {dash_reset['simulated_transfers_count']}")
assert dash_reset['available_balance'] == 20000.0
assert dash_reset['simulated_transfers_count'] == 0

print("--- ALL SIMULATION FLOW TESTS PASSED SUCCESSFULLY! ---")
