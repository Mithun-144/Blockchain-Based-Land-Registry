FROM ubuntu:20.04

RUN DEBIAN_FRONTEND=noninteractive apt-get update \
    && apt-get install -y --no-install-recommends socat curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /usr/local/bin/nbf-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/nbf-entrypoint.sh \
    && chmod +x /usr/local/bin/nbf-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/nbf-entrypoint.sh"]

