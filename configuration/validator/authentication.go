package validator

import (
	"errors"
	"strings"

	"github.com/clems4ever/authelia/configuration/schema"
)

var ldapProtocolPrefix = "ldap://"

func validateFileAuthenticationBackend(configuration *schema.FileAuthenticationBackendConfiguration, validator *schema.StructValidator) {
	if configuration.Path == "" {
		validator.Push(errors.New("Please provide a `path` for the users database in `authentication_backend`"))
	}
}

func validateLdapURL(url string, validator *schema.StructValidator) string {
	if strings.HasPrefix(url, ldapProtocolPrefix) {
		url = url[len(ldapProtocolPrefix):]
	}

	portColons := strings.Index(url, ":")

	// if no port is provided, we provide the default LDAP port
	// TODO(c.michaud): support LDAP over TLS.
	if portColons == -1 {
		url = url + ":389"
	}
	return url
}

func validateLdapAuthenticationBackend(configuration *schema.LDAPAuthenticationBackendConfiguration, validator *schema.StructValidator) {
	if configuration.URL == "" {
		validator.Push(errors.New("Please provide a URL to the LDAP server"))
	} else {
		configuration.URL = validateLdapURL(configuration.URL, validator)
	}

	if configuration.User == "" {
		validator.Push(errors.New("Please provide a user name to connect to the LDAP server"))
	}

	if configuration.Password == "" {
		validator.Push(errors.New("Please provide a password to connect to the LDAP server"))
	}

	if configuration.BaseDN == "" {
		validator.Push(errors.New("Please provide a base DN to connect to the LDAP server"))
	}

	if configuration.UsersFilter == "" {
		configuration.UsersFilter = "(cn={0})"
	}

	if configuration.GroupsFilter == "" {
		configuration.GroupsFilter = "(member={dn})"
	}

	if configuration.GroupNameAttribute == "" {
		configuration.GroupNameAttribute = "cn"
	}

	if configuration.MailAttribute == "" {
		configuration.MailAttribute = "mail"
	}
}

// ValidateAuthenticationBackend validates and update authentication backend configuration.
func ValidateAuthenticationBackend(configuration *schema.AuthenticationBackendConfiguration, validator *schema.StructValidator) {
	if configuration.Ldap == nil && configuration.File == nil {
		validator.Push(errors.New("Please provide `ldap` or `file` object in `authentication_backend`"))
	}

	if configuration.Ldap != nil && configuration.File != nil {
		validator.Push(errors.New("You cannot provide both `ldap` and `file` objects in `authentication_backend`"))
	}

	if configuration.File != nil {
		validateFileAuthenticationBackend(configuration.File, validator)
	} else if configuration.Ldap != nil {
		validateLdapAuthenticationBackend(configuration.Ldap, validator)
	}
}
