import re


def validate_email(email):
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_indian_phone(phone):
    if not phone:
        return False
    cleaned = re.sub(r'[^\d]', '', phone)
    if len(cleaned) == 10 and cleaned[0] in '6789':
        return True
    if len(cleaned) == 12 and cleaned[:2] == '91' and cleaned[2] in '6789':
        return True
    if len(cleaned) == 13 and cleaned[:3] == '+91' and cleaned[3] in '6789':
        return True
    return False


def validate_required_string(value, max_length=500):
    if not value or not isinstance(value, str):
        return False
    if len(value.strip()) == 0:
        return False
    if len(value) > max_length:
        return False
    return True


def validate_positive_number(value):
    if value is None:
        return False
    try:
        return float(value) > 0
    except (ValueError, TypeError):
        return False


def sanitize_input(value):
    if not isinstance(value, str):
        return value
    import html
    value = html.escape(value)
    value = re.sub(r'<[^>]*>', '', value)
    value = re.sub(r'javascript:', '', value, flags=re.IGNORECASE)
    value = re.sub(r'on\w+\s*=', '', value, flags=re.IGNORECASE)
    return value.strip()


def sanitize_object(obj):
    if isinstance(obj, dict):
        return {k: sanitize_object(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_object(item) for item in obj]
    if isinstance(obj, str):
        return sanitize_input(obj)
    return obj


def validate_customer_data(data):
    errors = []
    if not validate_required_string(data.get("name")):
        errors.append("Invalid name")
    if data.get("email") and not validate_email(data["email"]):
        errors.append("Invalid email")
    if data.get("phone") and not validate_indian_phone(data["phone"]):
        errors.append("Invalid phone number")
    return errors
