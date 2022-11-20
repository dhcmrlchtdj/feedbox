# deployment

## systemd

```sh
$ cat /usr/lib/systemd/system/feedbox.service
[Unit]
Description=Feedbox
Wants=network-online.target
After=network-online.target

[Service]
User=feedbox
Type=exec
Restart=on-abort
WorkingDirectory=/opt/app/feedbox
ExecStartPre=/opt/app/feedbox/_build/app migrate up
ExecStart=/opt/app/feedbox/_build/app serverAndWorker
EnvironmentFile=/opt/app/feedbox/dotenv

[Install]
WantedBy=multi-user.target
```

```sh
$ sudo EDITOR=nvim visudo -f /etc/sudoers.d/feedbox
feedbox ALL= NOPASSWD: /usr/bin/systemctl start   feedbox.service
feedbox ALL= NOPASSWD: /usr/bin/systemctl stop    feedbox.service
feedbox ALL= NOPASSWD: /usr/bin/systemctl restart feedbox.service
```

## backup

```sh
$ crontab -l
20 0 * * * /opt/app/feedbox/backup.sh
```

```sh
$ cat /path/to/feedbox/backup.sh

#!/usr/bin/bash

sqlite3 /opt/app/feedbox/feedbox.db \
	".backup '/opt/app/feedbox/feedbox.backup.db'"

bsdtar --posix --options='zstd:compression-level=22' \
	-cavf '/opt/app/feedbox/feedbox.backup.db.tar.zst' \
	--directory='/opt/app/feedbox/' \
	'feedbox.backup.db'

curl -s -XPOST 'https://s3' \
	-u 'username:password' \
	-F file=@/opt/app/feedbox/feedbox.backup.db.tar.zst
```
