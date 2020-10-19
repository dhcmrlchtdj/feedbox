package github

import (
	"encoding/json"
	"net/http"
	"sort"

	"github.com/pkg/errors"
)

func getProfile(client *http.Client) (*Profile, error) {
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, errors.New(resp.Status)
	}

	var profile Profile
	err = json.NewDecoder(resp.Body).Decode(&profile)
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
	resp, err := client.Get("https://api.github.com/user/emails")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", errors.New(resp.Status)
	}

	var emails []githubEmail
	err = json.NewDecoder(resp.Body).Decode(&emails)
	if err != nil {
		return "", err
	}

	var verifiedEmails []string
	for i := range emails {
		email := emails[i]
		if email.Verified {
			if email.Primary {
				return email.Email, nil
			}
			verifiedEmails = append(verifiedEmails, email.Email)
		}
	}
	if len(verifiedEmails) > 0 {
		sort.Strings(verifiedEmails)
		return verifiedEmails[0], nil
	}

	return "", errors.New("verified email is required")
}
