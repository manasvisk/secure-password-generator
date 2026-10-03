import random
import string


def get_password_length():
    """Ask for a password length of at least six characters."""
    while True:
        length_text = input("Enter password length: ")

        try:
            length = int(length_text)
        except ValueError:
            print("Error: Please enter a whole number.")
            continue

        if length < 6:
            print("Error: Password length must be at least 6 characters.")
            continue

        return length


def generate_password(length):
    """Build and shuffle a password containing letters and digits."""
    # Start with one character from each required character group.
    password_characters = [
        random.choice(string.ascii_uppercase),
        random.choice(string.ascii_lowercase),
        random.choice(string.digits),
    ]

    # Fill the remaining positions from all permitted character groups.
    all_characters = string.ascii_letters + string.digits
    for _ in range(length - len(password_characters)):
        password_characters.append(random.choice(all_characters))

    # Shuffle so the required characters are not always in predictable places.
    random.shuffle(password_characters)
    return "".join(password_characters)


def get_password_strength(length):
    """Return a strength label based on the password's length."""
    if length <= 7:
        return "Weak"
    if length <= 11:
        return "Medium"
    return "Strong"


def main():
    """Run the password generator until the user chooses to stop."""
    print("=================================")
    print("Secure Password Generator")
    print("=================================")

    while True:
        length = get_password_length()
        password = generate_password(length)
        strength = get_password_strength(length)

        print(f"\nGenerated Password: {password}")
        print(f"Password Strength: {strength}")

        # Keep asking until the user enters a clear yes/no response.
        while True:
            another_password = input("\nGenerate another password? (y/n): ").strip().lower()
            if another_password in ("y", "n"):
                break
            print("Please enter 'y' for yes or 'n' for no.")

        if another_password == "n":
            print("Thank you for using Secure Password Generator!")
            break


if __name__ == "__main__":
    main()