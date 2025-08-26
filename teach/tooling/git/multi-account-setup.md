Configure git for Personal and Multiple GitHub Enterprise Accounts

GitHub enterprise accounts on github.com, something like https://github.com/acme-source but not like github.acme.com which would be self-hosted, don't actually co-exist with the rest of gitHub.com. So your Acme GitHub Enterprise account can clone a repo, but can't contribute back to it, which is a practical problem using and contributing to Mod's subprojects as needed.

To make this situation works seamlessly, it relies on ssh and gitconfig settings.

# Configure ~/.gitconfig and linked files

```
[user]

    email= marchant@mac.com
    name = marchant
  
    ########### github.com BEGIN ###########
  
    # It is important the includeIf comes after the user configuration section
    # so that the email in the work config is picked up as the email to use
    [includeIf "hasconfig:remote.*.url:https://github.com/**"]
        path = ~/.gitconfig.personal
  

    # SSH remote to cover all bases

    [includeIf "hasconfig:remote.*.url:git@github.com:*/**"]
        path = ~/.gitconfig.personal
  
    ########### github.com END###########
  


    ########### github.com/acme-source BEGIN ###########
  
    # It is important the includeIf comes after the user configuration section
    # so that the email in the work config is picked up as the email to use
  
    [includeIf "hasconfig:remote.*.url:https://github.com/acme-source/**"]
        path = ~/.gitconfig.acme-source
  

    # SSH remote to cover all bases
  
    [includeIf "hasconfig:remote.*.url:git@github.com:acme-source/**"]
        path = ~/.gitconfig.acme-source
  
    [url "git@acme.github.com:acme-source"]
        insteadOf = git@github.com:acme-source
        pushInsteadOf = git@github.com:acme-source
  
    ########### github.com/acme-source END ###########
  

  
    ########### github.com/acme-personal BEGIN ###########
  
    # It is important the includeIf comes after the user configuration section
    # so that the email in the work config is picked up as the email to use
  
    [includeIf "hasconfig:remote.*.url:https://github.com/acme-personal/**"]
        path = ~/.gitconfig.acme-source
  
    # SSH remote to cover all bases
    [includeIf "hasconfig:remote.*.url:git@github.com:acme-personal/**"]
            path = ~/.gitconfig.acme-source

    [url "git@acme.github.com:acme-personal"]
            insteadOf = git@github.com:acme-personal
            pushInsteadOf = git@github.com:acme-personal
  
    ########### github.com/acme-source END ###########



    ########### github.acme.com/ BEGIN ###########
  
    # It is important the includeIf comes after the user configuration section
    # so that the email in the work config is picked up as the email to use
  
    [includeIf "hasconfig:remote.*.url:https://github.acme.com/**"]
        path = ~/.gitconfig.github.acme
  
    # SSH remote to cover all bases
  
    [includeIf "hasconfig:remote.*.url:git@github.acme.com:*/**"]
        path = ~/.gitconfig.github.acme
  
    ########### github.acme.com/ END ###########
  
    [core]
    excludesfile = ~/.gitignore        # Ignore .gitconfig files valid everywhere
```

and uses others references from there as well:

* ~/.gitconfig.personal
  ```
  [user]
  email = marchant@mac.com
  name = Benoit Marchant

  [github]
  user = "marchant" #should be inside double quote.

  [core]
  sshCommand = "ssh -i ~/.ssh/marchant.id_rsa" #should be inisde double quote.
  ```
* ~/.gitconfig.acme-source
  ```
  [url "acme.github.com:"]
      insteadOf = git@github.com:
  [url "ssh://git@acme.github.com/"]
      pushInsteadOf = https://acme.github.com/

  [user]
  email = bmarchant@acme.com
  name = Benoit Marchant

  [github]
  user = "bmarchant_acme" #should be inside double quote.

  [core]
  sshCommand = "ssh -i ~/.ssh/acme-source_id_rsa" #should be inside doublequote.  
  ```
* ~/.gitconfig.github.acme
  ```
  [url "ssh://git@github.acme.com/"]
      pushInsteadOf = https://github.acme.com/

  [user]
  email = bmarchant@acme.com
  name = Benoit Marchant

  [github]
  user = "bmarchant" #should be inside double quote.

  [core]
  sshCommand = "ssh -i ~/.ssh/github.acme.com.id_rsa" #should be inside doublequote.
  ```

# Setup ~/.ssh/config and linked files (rsa keys)

These keys are the ones you'll need to generate/configure on GitHub to configure your personal ssh access, see more here:

* [https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)
* [https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

## Create / setup ~/.ssh/config:

```
  Host acme.github.com
      IgnoreUnknown AddKeysToAgent,UseKeychain
      AddKeysToAgent yes
      UseKeychain yes
      User git
      HostName github.com
      IdentityFile ~/.ssh/acme-source_id_rsa
      IdentitiesOnly yes
  
  Host github.com
      IgnoreUnknown AddKeysToAgent,UseKeychain
      AddKeysToAgent yes
      UseKeychain yes
      User git
      HostName github.com
      IdentityFile ~/.ssh/marchant.id_rsa
      IdentitiesOnly yes
  
  Host github.acme.com
      IgnoreUnknown AddKeysToAgent,UseKeychain
      AddKeysToAgent yes
      UseKeychain yes
      User git
      HostName github.acme.com
      IdentityFile ~/.ssh/github.acme.com.id_rsa
      IdentitiesOnly yes
  
  #To be usedwhen using Cisco's VPN or on Mustang Network
  #Match hostgithub.com exec "dig internet.acme.com +short | grep 1.2."
  # User git
  # ProxyCommand nc -X connect -x internet.acme.com:83 %h %p
  # IdentitiesOnly yes
```

## Put the corresponding RSA keys to your github accounts in the right place

In the ~/.ssh/config file, there are 3 references to the 3 RSA key files for your GitHub accounts that you need to create for yourself for the 3 instances of GitHub:

* IdentityFile ~/.ssh/acme-source_id_rsa
* IdentityFile ~/.ssh/marchant.id_rsa
* IdentityFile ~/.ssh/github.acme.com.id_rsa

# ~/.ssh/known_hosts

The content bellow to put in that ~/.ssh/known_hosts file contains Public key fingerprints that are used to validate a connection to a remote server. Those public key fingerprints should work out of the box for github, but you'd need to add a public ssh-rsa key fingerprints for github.acme.com if needed:

```
github.com ssh-ed25519
AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl
github.acme.com ecdsa-sha2-nistp256
AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBI8ByDkVttpwfgYGiN0WaFRcigbt
jpd3We2+NMxlxaT9snYsobqzGtKmU3RJ9HrcbGwrWl8Z7dm7i+JwLHomTCY=
github.com ssh-rsa
AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4
Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/
BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/
hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxC
flmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwb
z0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51
ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/
YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/
WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=
github.com ecdsa-sha2-nistp256
AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9
nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
```

Learn more here about github's ssh key fingerprints and securel adding a github host to the ssh known_hosts file:

* [https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints](https://https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints)
* [https://serverfault.com/questions/856194/securely-add-a-host-e-g-github-to-the-ssh-known-hosts-file](https://serverfault.com/questions/856194/securely-add-a-host-e-g-github-to-the-ssh-known-hosts-file)
