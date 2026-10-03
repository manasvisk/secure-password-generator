import string
import unittest
from unittest.mock import patch

import secure_password_generator as generator


class PasswordGeneratorTests(unittest.TestCase):
    def test_generated_password_has_requested_length_and_character_groups(self):
        for length in (6, 8, 12, 32):
            with self.subTest(length=length):
                password = generator.generate_password(length)

                self.assertEqual(len(password), length)
                self.assertTrue(any(character in string.ascii_uppercase for character in password))
                self.assertTrue(any(character in string.ascii_lowercase for character in password))
                self.assertTrue(any(character in string.digits for character in password))

    def test_password_length_retries_invalid_and_too_short_values(self):
        with patch("builtins.input", side_effect=("not a number", "5", "6")):
            with patch("builtins.print") as print_mock:
                self.assertEqual(generator.get_password_length(), 6)

        self.assertEqual(print_mock.call_count, 2)

    def test_strength_labels_at_boundaries(self):
        self.assertEqual(generator.get_password_strength(6), "Weak")
        self.assertEqual(generator.get_password_strength(7), "Weak")
        self.assertEqual(generator.get_password_strength(8), "Medium")
        self.assertEqual(generator.get_password_strength(11), "Medium")
        self.assertEqual(generator.get_password_strength(12), "Strong")


if __name__ == "__main__":
    unittest.main()