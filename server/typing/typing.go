package typing

import "github.com/dgrijalva/jwt-go"

type Credential struct {
	UserID int64
	jwt.StandardClaims
}
