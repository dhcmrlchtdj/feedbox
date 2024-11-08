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
ExecStartPre=/opt/app/feedbox/_build/feedbox migrate up
ExecStart=/opt/app/feedbox/_build/feedbox serverAndWorker
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

## log

```sh
$ cat /etc/vector/vector.json

{
	"data_dir": "/var/lib/vector",
	"sources": {
		"feedbox_source": {
			"type": "journald",
			"include_units": ["feedbox.service"]
		}
	},
	"transforms": {
		"feedbox_transform": {
			"type": "remap",
			"inputs": ["feedbox_source"],
			"source": ". = parse_json!(.message)"
		},
		"feedbox_err_transform": {
			"type": "filter",
			"inputs": ["feedbox_transform"],
			"condition": ".level == \"error\""
		}
	},
	"sinks": {
		"feedbox_err_telegram": {
			"type": "http",
			"inputs": ["feedbox_err_transform"],
			"uri": "https://xxxx",
			"auth": {
				"strategy": "basic",
				"user": "xxxx",
				"password": "xxxx"
			},
			"encoding": {
				"codec": "json",
				"json": {
					"pretty": true
				}
			}
		},
		"feedbox_s3": {
			"type": "aws_s3",
			"inputs": ["feedbox_transform"],
			"endpoint": "https://xxxx",
			"bucket": "log",
			"region": "auto",
			"auth": {
				"access_key_id": "xxxx",
				"secret_access_key": "xxxx"
			},
			"key_prefix": "feedbox/%Y/%m/%d/",
			"content_type": "application/zstd",
			"filename_extension": "json.zstd",
			"encoding": {
				"codec": "json"
			},
			"compression": "zstd"
		}
	}
}
```
