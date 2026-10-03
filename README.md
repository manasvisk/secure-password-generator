# Secure Password Generator

A beginner-friendly command-line project for practicing Python modules, strings, functions, loops, and input validation. It uses only Python's standard library.

## Run the program

From this folder, run:

```sh
python3 secure_password_generator.py
```

Enter a password length of at least 6. The program guarantees at least one uppercase letter, one lowercase letter, and one digit. It can generate more passwords in the same session.

## Example

```text
=================================
Secure Password Generator
=================================
Enter password length: 10

Generated Password: A7mK9pQ2xR
Password Strength: Medium

Generate another password? (y/n): n
Thank you for using Secure Password Generator!
```

The displayed password is an example; each run produces a random result.

## Code walkthrough

- `import random` loads the standard-library module used to choose and shuffle characters. `import string` provides the uppercase, lowercase, and digit character sets.
- `get_password_length()` prompts repeatedly, converts the response to an integer, reports non-numeric input, and rejects values below 6 before returning a valid length.
- `generate_password(length)` first chooses one uppercase letter, one lowercase letter, and one digit. It fills the remaining positions from the allowed character pool, shuffles all characters, then joins them into a string.
- `get_password_strength(length)` maps lengths 6-7 to Weak, 8-11 to Medium, and 12 or more to Strong.
- `main()` prints the title, calls the input and password functions, displays the result, and loops so the user can generate multiple passwords. Its inner loop only accepts `y` or `n`.
- `if __name__ == "__main__":` runs `main()` when this file is started as a script, while allowing the functions to be imported in tests.

## Concepts practiced

- **Modules:** importing Python's built-in `random` and `string` modules.
- **Randomization:** selecting characters and shuffling their order.
- **String manipulation:** combining character groups and joining characters into a password.
- **Functions:** dividing input, generation, strength labels, and program flow into reusable units.
- **Loops:** repeating input validation and allowing multiple passwords per session.
- **Input validation:** handling non-numeric values, enforcing the minimum length, and validating yes/no responses.

## Run the tests

The project has no third-party dependencies. Run its tests with:

```sh
python3 -m unittest discover -s tests
```

> This project uses `random` because it is part of the learning requirements. Python's `random` module is not designed for cryptographic security, so use `secrets` instead when generating passwords for real accounts.# secure-password-generator
