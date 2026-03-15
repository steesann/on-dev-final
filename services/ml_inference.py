import numpy as np


def run_inference(test_x: np.ndarray) -> np.ndarray:
    """
    Временная заглушка под инференс.

    Должна вернуть массив shape (N, C),
    где:
    - N = количество объектов
    - C = количество классов
    - значения = вероятности по классам
    """

    n_samples = len(test_x)
    n_classes = 5  # временно; заменить на реальное число классов

    preds = np.random.rand(n_samples, n_classes)
    preds = preds / preds.sum(axis=1, keepdims=True)
    return preds