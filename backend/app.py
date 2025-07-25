from main import create_app
from main import db

import os

app = create_app()

app.app_context().push()

db.create_all()

if __name__ == '__main__':
    app.run(debug=False,port=os.getenv('PORT'))