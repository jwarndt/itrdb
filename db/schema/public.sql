
DROP TABLE IF EXISTS public.investigators CASCADE
CREATE TABLE IF NOT EXISTS public.investigators
(
    id SERIAL,
    first_name text,
    last_name text,
    full_name text,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sites
(
    id SERIAL,
    name text NOT NULL,
    geom geometry,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.chronologies
(
    
);

CREATE TABLE IF NOT EXISTS public.species 
(
    id SERIAL,
    code text,
    scientific_name text,
    common_names text[],
    description text,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.paleo_record_type
(
    id SERIAL,
    name text,
    description,
    PRIMARY KEY (id)
);