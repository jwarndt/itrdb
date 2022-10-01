FROM python:3.9.13-slim

WORKDIR /tmp

COPY requirements .
COPY app .

RUN apt-get update && apt-get install -y build-essential libpq libgdal-dev

RUN pip install --upgrade pip
RUN pip install requirements.txt