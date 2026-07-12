#!/bin/bash
# One-time: load the Vercel DNS zone for evercoolthailand.com with the mail
# and archive records, so switching nameservers to Vercel changes nothing.
set -e
KEY=$(grep '^# RESEND_API_KEY=' .env.local | sed 's/^# RESEND_API_KEY=//' | tr -d '"')
ROOT_DKIM=$(curl -s https://api.resend.com/domains/2ae9fdea-0f6f-4820-b51c-f3e7f9a29b56 -H "Authorization: Bearer $KEY" | python3 -c "import json,sys; print([r['value'] for r in json.load(sys.stdin)['records'] if r['record']=='DKIM'][0])")
TEST_DKIM=$(curl -s https://api.resend.com/domains/59a79c23-6c1d-4564-b5e5-a004f02f7cc0 -H "Authorization: Bearer $KEY" | python3 -c "import json,sys; print([r['value'] for r in json.load(sys.stdin)['records'] if r['record']=='DKIM'][0])")

# Vercel flips the domain into DNS-zone mode shortly after the nameserver
# change; retry until that happens (up to 30 minutes), then load everything.
echo "Waiting for Vercel to activate the DNS zone (retries every 30s)..."
tries=0
until vercel dns add evercoolthailand.com '@' MX inbound-smtp.ap-northeast-1.amazonaws.com 10 2>/dev/null; do
  tries=$((tries+1))
  if [ $tries -gt 60 ]; then echo "Gave up after 30 minutes; run again later."; exit 1; fi
  sleep 30
done
echo "Zone active. Loading the rest..."
vercel dns add evercoolthailand.com '@' A 216.150.1.1
vercel dns add evercoolthailand.com 'resend._domainkey' TXT "$ROOT_DKIM"
vercel dns add evercoolthailand.com 'send' MX feedback-smtp.ap-northeast-1.amazonses.com 10
vercel dns add evercoolthailand.com 'send' TXT "v=spf1 include:amazonses.com ~all"
vercel dns add evercoolthailand.com '_dmarc' TXT "v=DMARC1; p=none;"
vercel dns add evercoolthailand.com 'test' MX inbound-smtp.ap-northeast-1.amazonaws.com 10
vercel dns add evercoolthailand.com 'resend._domainkey.test' TXT "$TEST_DKIM"
vercel dns add evercoolthailand.com 'send.test' MX feedback-smtp.ap-northeast-1.amazonses.com 10
vercel dns add evercoolthailand.com 'send.test' TXT "v=spf1 include:amazonses.com ~all"
vercel dns add evercoolthailand.com 'mail' A 185.149.114.46
vercel dns add evercoolthailand.com 'webmail' A 185.149.114.46

echo ""
echo "ALL RECORDS ADDED. Now in Squarespace set nameservers to:"
echo "  ns1.vercel-dns.com"
echo "  ns2.vercel-dns.com"
