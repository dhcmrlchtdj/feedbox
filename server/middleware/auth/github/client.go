package github

import (
	"context"
	"encoding/json"
	"net/http"
	"sort"

	"github.com/morikuni/failure"
)

type Config struct {
	ClientID     string
	ClientSecret string
}

type Profile struct {
	Email string `json:"email,omitempty"`
	ID    int64  `json:"id"`
}

func getProfile(ctx context.Context, client *http.Client) (*Profile, error) {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://api.github.com/user",
		http.NoBody,
	)
	if err != nil {
		return nil, err
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, failure.Unexpected(resp.Status)
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

func getEmail(ctx context.Context, client *http.Client) (string, error) {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://api.github.com/user/emails",
		http.NoBody,
	)
	if err != nil {
		return "", err
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", failure.Unexpected(resp.Status)
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

	return "", failure.Unexpected("verified email is required")
}
