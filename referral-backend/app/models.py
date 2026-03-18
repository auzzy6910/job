from pydantic import BaseModel
from typing import Optional

class UserSignup(BaseModel):
    username: str
    email: str
    password: str
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class ActivateAccount(BaseModel):
    pass

class DepositRequest(BaseModel):
    amount: float

class BoosterDeposit(BaseModel):
    amount: float = 200.0

class StarGiftRequest(BaseModel):
    receiver_username: str
    star_value: float

class WithdrawRequest(BaseModel):
    amount: float
