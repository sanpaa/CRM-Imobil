/**
 * Google Calendar Service
 * Application layer - OAuth + Calendar sync for visits
 */

const crypto = require('crypto');
const { google } = require('googleapis');

class GoogleCalendarService {
    constructor(connectionRepository, eventRepository) {
        this.connectionRepository = connectionRepository;
        this.eventRepository = eventRepository;
    }

    getOAuthClient() {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
            throw new Error('Missing Google OAuth environment variables');
        }

        return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    }

    getStateSecret() {
        const secret = process.env.GOOGLE_OAUTH_STATE_SECRET;
        if (!secret) {
            throw new Error('Missing GOOGLE_OAUTH_STATE_SECRET');
        }
        return secret;
    }

    buildState(payload) {
        const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = crypto
            .createHmac('sha256', this.getStateSecret())
            .update(data)
            .digest('base64url');
        return `${data}.${signature}`;
    }

    parseState(state) {
        if (!state || !state.includes('.')) return null;
        const [data, signature] = state.split('.');
        const expected = crypto
            .createHmac('sha256', this.getStateSecret())
            .update(data)
            .digest('base64url');
        if (signature !== expected) {
            return null;
        }
        try {
            return JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
        } catch (error) {
            return null;
        }
    }

    getScopes() {
        return [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.email',
            'openid'
        ];
    }

    async getStatus(companyId, userId) {
        const connection = await this.connectionRepository.findByUserId(companyId, userId);
        if (!connection || !connection.is_connected) {
            return { connected: false };
        }

        return {
            connected: true,
            email: connection.email || null,
            calendarId: connection.calendar_id || null,
            lastSyncAt: connection.last_sync_at || null
        };
    }

    async createAuthUrl(userId, companyId) {
        const oauthClient = this.getOAuthClient();

        const state = this.buildState({
            companyId,
            userId,
            ts: Date.now()
        });

        const url = oauthClient.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: this.getScopes(),
            state
        });

        return url;
    }

    async handleOAuthCallback(code, state) {
        const payload = this.parseState(state);
        if (!payload || !payload.companyId || !payload.userId) {
            throw new Error('Invalid OAuth state');
        }

        const existing = await this.connectionRepository.findByUserId(payload.companyId, payload.userId);
        const oauthClient = this.getOAuthClient();
        const { tokens } = await oauthClient.getToken(code);
        oauthClient.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauthClient });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo?.data?.email || null;

        const connectionData = {
            is_connected: true,
            email,
            access_token: tokens.access_token || null,
            refresh_token: tokens.refresh_token || existing?.refresh_token || null,
            token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
            scope: tokens.scope || this.getScopes().join(' '),
            calendar_id: 'primary'
        };

        await this.connectionRepository.upsert(payload.companyId, payload.userId, connectionData);

        return { companyId: payload.companyId, email };
    }

    async disconnect(companyId, userId) {
        const connection = await this.connectionRepository.findByUserId(companyId, userId);
        if (!connection) {
            return { disconnected: true };
        }

        await this.connectionRepository.update(companyId, userId, {
            is_connected: false,
            access_token: null,
            refresh_token: null,
            token_expiry: null,
            scope: null
        });

        return { disconnected: true };
    }

    async syncVisit(companyId, userId, visit, options = {}) {
        const connection = await this.connectionRepository.findByUserId(companyId, userId);
        if (!connection || !connection.is_connected || (!connection.refresh_token && !connection.access_token)) {
            throw new Error('Google Calendar not connected');
        }

        const oauthClient = this.getOAuthClient();
        oauthClient.setCredentials({
            access_token: connection.access_token || undefined,
            refresh_token: connection.refresh_token || undefined,
            expiry_date: connection.token_expiry ? new Date(connection.token_expiry).getTime() : undefined
        });

        const calendar = google.calendar({ version: 'v3', auth: oauthClient });

        const timezone = options.timezone || process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Sao_Paulo';
        const durationMinutes = Number(options.durationMinutes || 60);

        const startDateTime = this.buildDateTimeString(visit.dataVisita, visit.horaVisita);
        const endDateTime = this.addMinutesToDateTime(startDateTime, durationMinutes);

        const eventPayload = {
            summary: options.title || this.buildDefaultTitle(visit),
            description: options.details || this.buildDefaultDetails(visit),
            start: {
                dateTime: options.start || startDateTime,
                timeZone: timezone
            },
            end: {
                dateTime: options.end || endDateTime,
                timeZone: timezone
            }
        };

        const calendarId = options.calendarId || connection.calendar_id || 'primary';
        const existing = await this.eventRepository.findByVisitId(companyId, userId, visit.id);

        let eventResponse;
        if (existing && existing.event_id) {
            eventResponse = await calendar.events.update({
                calendarId,
                eventId: existing.event_id,
                requestBody: eventPayload
            });
        } else {
            eventResponse = await calendar.events.insert({
                calendarId,
                requestBody: eventPayload
            });
        }

        const eventId = eventResponse?.data?.id;
        if (eventId) {
            await this.eventRepository.upsert(companyId, userId, visit.id, {
                event_id: eventId,
                calendar_id: calendarId,
                last_synced_at: new Date().toISOString()
            });
        }

        await this.connectionRepository.update(companyId, userId, {
            last_sync_at: new Date().toISOString(),
            access_token: oauthClient.credentials.access_token || connection.access_token,
            refresh_token: oauthClient.credentials.refresh_token || connection.refresh_token,
            token_expiry: oauthClient.credentials.expiry_date
                ? new Date(oauthClient.credentials.expiry_date).toISOString()
                : connection.token_expiry
        });

        return {
            eventId: eventId || null,
            calendarId
        };
    }

    buildDefaultTitle(visit) {
        if (visit.codigoReferencia) {
            return `Visita ${visit.codigoReferencia}`;
        }
        if (visit.cliente?.nome) {
            return `Visita: ${visit.cliente.nome}`;
        }
        return 'Visita agendada';
    }

    buildDefaultDetails(visit) {
        const lines = [];
        if (visit.status) lines.push(`Status: ${visit.status}`);
        if (visit.cliente?.nome) lines.push(`Cliente: ${visit.cliente.nome}`);
        if (visit.corretor?.nome) lines.push(`Corretor: ${visit.corretor.nome}`);
        if (visit.proprietario?.nome) lines.push(`Proprietario: ${visit.proprietario.nome}`);
        if (visit.codigoReferencia) lines.push(`Referencia: ${visit.codigoReferencia}`);
        if (visit.observacoes) lines.push(`Observacoes: ${visit.observacoes}`);
        return lines.join('\n');
    }

    buildDateTimeString(dateStr, timeStr) {
        if (!dateStr || !timeStr) {
            throw new Error('Missing visit date or time');
        }
        const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
        return `${dateStr}T${normalizedTime}`;
    }

    addMinutesToDateTime(dateTimeStr, minutesToAdd) {
        const [datePart, timePart] = dateTimeStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);
        const date = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0, 0);
        date.setMinutes(date.getMinutes() + minutesToAdd);

        const pad = (value) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
}

module.exports = GoogleCalendarService;
