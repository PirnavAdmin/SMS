# Public domain Nginx setup

The Docker frontend serves the application on port 3000 and proxies `/api` and
`/uploads` to the backend. This host Nginx config terminates HTTPS and forwards
the public domain to that frontend.

Before enabling this config, point the `pupilscholar.com` and `www`
`A` records at `15.206.4.182`, allow inbound ports 80 and 443 in the host
firewall/security group, and issue a Let's Encrypt certificate for both names.
The certificate paths in `pupilscholar.com.conf` assume Certbot's standard
`/etc/letsencrypt/live/pupilscholar.com/` layout. The ACME challenge location
uses `/var/www/certbot` as its webroot.

Install this file under `/etc/nginx/sites-available/pupilscholar.com`, enable
it in `sites-enabled`, and run `nginx -t` followed by `systemctl reload nginx`.
Ensure the Docker Compose frontend is running and reachable on host port 3000.
Renew certificates with Certbot's systemd timer (or the renewal mechanism
provided by the host's Certbot package); reload Nginx after renewal.

Keep the database host in `.env` as `DB_HOST`; the public website domain does
not replace the database address. The Compose frontend build now uses relative
API requests, so production traffic stays on HTTPS at the public domain.
