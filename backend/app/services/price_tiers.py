from fastapi import HTTPException

# Define price tiers
PRICE_TIERS = {
    4.99: 7,
    19.99: 30,
    29.99: 60,
    39.99: 90,
    49.99: 120,
    59.99: 150,
    69.99: 180,
}


def get_duration_from_price(price: float) -> int:
    """Return number of days for a given price."""
    if price not in PRICE_TIERS:
        raise HTTPException(status_code=400, detail="Invalid price tier")
    return PRICE_TIERS[price]
