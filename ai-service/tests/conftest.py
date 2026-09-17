import pytest

from synthetic import make_onion_photo


@pytest.fixture
def onion_photo():
    """Returns the factory itself (not one image) so each test can pick its
    own size/damage/blur/darkness."""
    return make_onion_photo
