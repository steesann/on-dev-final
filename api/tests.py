import io
import numpy as np
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UploadTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="user2",
            password="user212345",
            first_name="Anna",
            last_name="Ivanova",
            role="user",
        )

    def authenticate(self):
        response = self.client.post(
            "/api/token/",
            {"username": "user2", "password": "user212345"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def make_valid_npz(self):
        buffer = io.BytesIO()
        np.savez(
            buffer,
            test_x=np.random.rand(4, 10),
            test_y=np.array([0, 1, 0, 1]),
        )
        buffer.seek(0)
        return SimpleUploadedFile(
            "test_dataset.npz",
            buffer.read(),
            content_type="application/octet-stream",
        )

    def test_upload_requires_auth(self):
        file = self.make_valid_npz()
        response = self.client.post(
            "/api/upload/",
            {"file": file},
            format="multipart",
        )
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_upload_accepts_valid_npz(self):
        self.authenticate()
        file = self.make_valid_npz()

        response = self.client.post(
            "/api/upload/",
            {"file": file},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("accuracy", response.data)
        self.assertIn("loss", response.data)