# deployment

## systemd

```
$ cat ~/.config/systemd/user/feedbox.service
[Unit]
Description=Feedbox
Wants=network-online.target
After=network-online.target

[Service]
Type=exec
Restart=on-abort
WorkingDirectory=/path/to/feedbox
ExecStartPre=/path/to/feedbox/_build/app migrate up
ExecStart=/path/to/feedbox/_build/app serverAndWorker
EnvironmentFile=/path/to/feedbox/dotenv

[Install]
WantedBy=multi-user.target
```

## backup

```
$ crontab -l
20 * * * * /path/to/feedbox/backup.sh

$ cat /path/to/feedbox/backup.sh

#!/usr/bin/bash

sqlite3 /path/to/feedbox/feedbox.db \
	".backup '/path/to/feedbox/feedbox.backup.db'"
```
