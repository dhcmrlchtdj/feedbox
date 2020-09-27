package github

import (
	"encoding/json"
	"errors"
	"net/http"
	"sort"
)

func getProfile(client *http.Client) (*Profile, error) {
	res, err := client.Get("https://api.github.com/user")
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		return nil, errors.New(res.Status)
	}

	var profile Profile
	err = json.NewDecoder(res.Body).Decode(&profile)
	if err != nil {
		return nil, err
	}

	return &profile, nil
}

type githubEmail struct {
	Email    string `json:"email"`
	Primary  bool   `json:"primary"`
	Verified bool   `json:"verified"`
}

func getEmail(client *http.Client) (string, error) {
	res, err := client.Get("https://api.github.com/user/emails")
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		return "", errors.New(res.Status)
	}

	var emails []githubEmail
	err = json.NewDecoder(res.Body).Decode(&emails)
	if err != nil {
		return "", err
	}

	var verifiedEmails []string
	for _, email := range emails {
		if email.Verified {
			verifiedEmails = append(verifiedEmails, email.Email)
			if email.Primary {
				return email.Email, nil
			}
		}
	}
	if len(verifiedEmails) > 0 {
		sort.Strings(verifiedEmails)
		return verifiedEmails[0], nil
	}

	return "", errors.New("verified email is required")
}
