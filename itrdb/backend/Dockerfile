FROM python:3.9.13-slim
LABEL author="Jacob W. Arndt"

WORKDIR /tmp

RUN apt-get update && apt-get install build-essential postgresql-client curl libpq-dev gdal-bin libgdal-dev -y

COPY scripts scripts
COPY app app
COPY requirements.txt /tmp/requirements.txt

RUN pip install --upgrade pip
RUN pip install -r /tmp/requirements.txt

CMD ["sh", "scripts/run_dev.sh"]