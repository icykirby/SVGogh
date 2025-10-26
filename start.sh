#dedicate 4 workers to flask api
gunicorn -w 4 app:app
