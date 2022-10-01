DROP TABLE IF EXISTS investigators CASCADE
CREATE TABLE IF NOT EXISTS investigators
(
    id SERIAL,
    first_name text,
    last_name text,
    full_name text,
    CONSTRAINT PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sites
(
    id SERIAL,
    name text NOT NULL,
    geom geometry,
    CONSTRAINT PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS chronologies
(
    
)