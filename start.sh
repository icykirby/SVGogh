#dedicate 4 workers to flask api
python -m gunicorn -w 4 app:app
