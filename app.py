from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SECRET_KEY'] = 'your_secret_key'
db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'index'  # если неавторизован, переходит на / (login страницу)

# ---------- Модель пользователя ----------
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

# ---------- Создание (инициализация) БД ----------
with app.app_context():
    db.create_all()

    # Создадим пользователя "nickazula" / "root" (если его еще нет)
    admin_user = User.query.filter_by(username='nickazula').first()
    if not admin_user:
        hashed_password = generate_password_hash('root', method='pbkdf2:sha256')
        admin_user = User(username='nickazula', password=hashed_password)
        db.session.add(admin_user)
        db.session.commit()
        print("Создан админ-пользователь: nickazula / root")

# ---------- Flask-Login коллбек ----------
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ---------- Роуты ----------

@app.route('/')
def index():
    # Просто рендерим login.html — страницу входа
    return render_template("login.html")

@app.route('/login_page')
def login_page():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json  # JS fetch('/login', { method:'POST', body: JSON… })
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password):
        login_user(user)
        return jsonify({"message": "Вход выполнен"}), 200
    else:
        return jsonify({"message": "Неверный логин или пароль"}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Пользователь уже существует"}), 400

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Регистрация успешна"}), 200

@app.route('/home')
@login_required
def home():
    # Главная страница (после входа)
    # home.html = тот же файл, что вы назвали start_page.html или home.html
    return render_template("home.html")

@app.route('/registration')
def registration_page():
    return render_template('registration.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(debug=True)
