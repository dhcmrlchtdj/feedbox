package github

import (
	"encoding/json"
	"errors"
	"io"
	"io/ioutil"
	"net/http"
	"sort"
)

func getProfile(client *http.Client) (*Profile, error) {
	resp, err := client.Get("https://api.github.com/user")
	if resp != nil {
		defer resp.Body.Close()
	}
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != 200 {
		io.Copy(ioutil.Discard, resp.Body)
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
	if resp != nil {
		defer resp.Body.Close()
	}
	if err != nil {
		return "", err
	}

	if resp.StatusCode != 200 {
		io.Copy(ioutil.Discard, resp.Body)
		return "", errors.New(resp.Status)
	}

	var emails []githubEmail
	err = json.NewDecoder(resp.Body).Decode(&emails)
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
