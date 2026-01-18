## Gateway Silent
- Check last uplink age
- Verify MQTT publish
- Inspect RF stats

## Explorer Provisioning
- Ensure `chirpstack_explorer` is running: `docker compose --profile explorer up -d chirpstack_explorer`
- Confirm `secrets/chirpstack_explorer_token` contains a valid API key.
- Use the Provision modal for Tenant/Application/Device Profile/Gateway/Device/Keys.
- If requests fail, check `chirpstack_explorer` logs and ChirpStack API permissions.
