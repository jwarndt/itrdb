!#/bin/bash

psql postgresql://itrdbadmin:itrdbadmin@itrdb-db:5432/itrdbdb -f /tmp/db/schema/public.sql
psql postgresql://itrdbadmin:itrdbadmin@itrdb-db:5432/itrdbdb -f /tmp/db/data/public-data.sql