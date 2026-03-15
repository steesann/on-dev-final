```md
# Alien Signal Classifier

Система для **классификации радиосигналов инопланетных цивилизаций** с использованием нейронной сети.

Проект состоит из трёх основных частей:

- **ML-модуль** — обучение и экспорт модели
- **Backend** — REST API для работы с пользователями и моделью
- **Frontend** — пользовательский интерфейс

---

# Архитектура проекта

```

alien_project/
│
├── ml/               # обучение модели
│   ├── data/
│   ├── scripts/
│   └── exports/
│
├── backend/          # Django backend
│   ├── manage.py
│   ├── backend/
│   ├── accounts/
│   ├── api/
│   └── services/
│
└── frontend/         # HTML / CSS / JS интерфейс

```

---

# Используемые технологии

## Backend
- Python
- Django
- Django REST Framework
- JWT (djangorestframework-simplejwt)
- NumPy
- TensorFlow / Keras (для инференса модели)

## Frontend
- HTML
- CSS
- JavaScript

## База данных
- SQLite

---

# Роли пользователей

В системе предусмотрено две роли:

## admin
Администратор может:
- создавать новых пользователей
- просматривать свой профиль

## user
Пользователь может:
- загружать `.npz` датасет
- запускать модель
- просматривать аналитику

---

# API Endpoints

| Метод | Endpoint | Назначение |
|------|---------|-------------|
| POST | `/api/token/` | Авторизация |
| GET | `/api/profile/` | Профиль пользователя |
| POST | `/api/register/` | Создание пользователя (admin) |
| POST | `/api/upload/` | Загрузка `.npz` датасета |

---

# Запуск проекта

## 1. Клонирование репозитория

```

git clone <repo_url>
cd alien_project

```

---

# Запуск Backend

Перейдите в папку backend:

```

cd backend

```

## Создание виртуального окружения

```

python -m venv .venv

```

### Активация (bash)

```

source .venv/bin/activate

```

### Активация (fish)

```

source .venv/bin/activate.fish

```

---

## Установка зависимостей

```

pip install -r requirements.txt

```

---

## Миграции базы данных

```

python manage.py migrate

```

---

## Создание тестовых пользователей

```

python manage.py seed_users

```

Будут созданы пользователи:

```

admin / admin12345
user / user12345

```

---

## Запуск backend

```

python manage.py runserver

```

Backend будет доступен по адресу:

```

[http://localhost:8000](http://localhost:8000)

```

---

# Запуск Frontend

Перейдите в папку frontend:

```

cd frontend

```

Запустите сервер:

```

npx http-server -p 8080

```

Frontend будет доступен по адресу:

```

[http://localhost:8080](http://localhost:8080)

```

---

# Использование системы

## Авторизация

```

POST /api/token/

````

Пример запроса:

```json
{
  "username": "admin",
  "password": "admin12345"
}
````

Ответ:

```json
{
  "access": "jwt_token",
  "refresh": "jwt_refresh",
  "user": {
    "id": 1,
    "username": "admin",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }
}
```

---

# Загрузка датасета

```
POST /api/upload/
```

Тип запроса:

```
multipart/form-data
```

Поле:

```
file
```

Файл `.npz` должен содержать:

```
test_x
test_y
```

---

# Ответ сервера

Backend возвращает:

```json
{
  "accuracy": 0.91,
  "loss": 0.27,
  "history": {},
  "class_counts_train": [],
  "test_accuracy_per_sample": [],
  "class_counts_valid": []
}
```

Эти данные используются frontend для построения графиков.

---

# Модель

Обученная модель хранится в:

```
ml/exports/model.h5
```

Backend загружает модель и использует её для инференса.

---

# База данных

Используется SQLite.

Основная таблица:

```
accounts_user
```

Основные поля:

* id
* username
* password
* first_name
* last_name
* role
* date_joined
* last_login
* is_superuser
* is_staff
* is_active

---

# Разработка

При изменении моделей необходимо выполнить:

```
python manage.py makemigrations
python manage.py migrate
```

---

# Возможные улучшения

* хранение истории загрузок
* docker-развертывание
* использование PostgreSQL
* асинхронный инференс модели

```
```
