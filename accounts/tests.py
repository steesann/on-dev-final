from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            password="admin12345",
            first_name="Admin",
            last_name="User",
            role="admin",
        )
        self.user = User.objects.create_user(
            username="user1",
            password="user12345",
            first_name="Ivan",
            last_name="Petrov",
            role="user",
        )

    def test_login_success(self):
        response = self.client.post(
            "/api/token/",
            {"username": "admin", "password": "admin12345"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_fail_wrong_password(self):
        response = self.client.post(
            "/api/token/",
            {"username": "admin", "password": "wrongpass"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_authorized(self):
        login = self.client.post(
            "/api/token/",
            {"username": "user1", "password": "user12345"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

        token = login.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "user1")
        self.assertEqual(response.data["role"], "user")

    def test_admin_can_create_user(self):
        login = self.client.post(
            "/api/token/",
            {"username": "admin", "password": "admin12345"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

        token = login.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        response = self.client.post(
            "/api/register/",
            {
                "username": "newuser",
                "password": "newuser12345",
                "first_name": "Petr",
                "last_name": "Sidorov",
                "role": "user",
            },
            format="json",
        )

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertTrue(User.objects.filter(username="newuser").exists())