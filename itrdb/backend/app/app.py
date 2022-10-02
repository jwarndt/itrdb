from flask import Flask

from routes import itrdb_api

def create_app():
    app = Flask(__name__)
    app.register_blueprint(itrdb_api.blueprint)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=9064)