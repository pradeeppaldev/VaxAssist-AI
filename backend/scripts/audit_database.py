import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio
from bson import ObjectId
from app.database import db_manager, get_database
from app.services.schedule_engine import calculate_member_schedule

async def run_audit():
    await db_manager.connect()
    db = get_database()
    
    # 1. Inspect all users
    users = await db['users'].find({}).to_list(100)
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"User: id={u.get('_id')}, email={u.get('email')}, role={u.get('role')}, name={u.get('full_name')}")

    # 2. Inspect original Sharma family members
    sharma_names = ['Aarav Sharma', 'Ananya Sharma', 'Rajesh Sharma', 'Pooja Sharma', 'Ramesh Sharma']
    members = await db['family_members'].find({'full_name': {'$in': sharma_names}}).to_list(10)
    print(f"\nTotal Core Sharma Family Members in DB: {len(members)}")
    for m in members:
        m_id = str(m['_id'])
        name = m.get('full_name')
        dob = m.get('date_of_birth')
        user_id = m.get('user_id')
        recs = await db['vaccination_records'].find({'family_member_id': m_id}).to_list(100)
        sch = calculate_member_schedule(
            date_of_birth=dob,
            existing_records=recs,
        )
        summary = sch["summary"]
        items = sch["schedule_items"]
        print(f"\nMember: {name} (ID: {m_id}, User: {user_id}, DOB: {dob})")
        print(f"  Existing records in DB: {len(recs)}")
        for r in recs:
            print(f"    - {r.get('vaccine_code')} Dose {r.get('dose_number')} on {r.get('administered_date')} ({r.get('vaccination_status')})")
        print(f"  Calculated Schedule: Completed={summary['completed_count']}, Overdue={summary['overdue_count']}, Due={summary['due_count']}, Upcoming={summary['upcoming_count']}, Missed={summary['missed_count']}")
        for item in items:
            if item['status'] in ('OVERDUE', 'DUE', 'UPCOMING', 'CATCH_UP_REQUIRED'):
                print(f"    * [{item['status']}] {item['vaccine_name']} ({item.get('dose_name')}) -> Due: {item['calculated_due_date']}, Reason: {item.get('status_reason')}")

    await db_manager.disconnect()

if __name__ == '__main__':
    asyncio.run(run_audit())
