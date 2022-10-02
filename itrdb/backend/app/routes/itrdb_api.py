from flask import Blueprint

blueprint = Blueprint('itrdb_blueprint', __name__)

@blueprint.route('/')
def index():
    return "success hit to itrdb api"