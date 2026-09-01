import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from sqlalchemy.pool import NullPool

DATABASE_URL = "postgresql+asyncpg://postgres.kfgrtjvoslkhqnlrdhyu:Bl1aP07INHvK4vmX@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?statement_cache_size=0"

async def main():
    engine = create_async_engine(
        DATABASE_URL,
        poolclass=NullPool,
    )
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            await conn.execute(text("SELECT 2"))
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
