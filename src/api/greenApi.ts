export type GreenApiConfig = {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
};

export type GetStateResponse = {
  stateInstance?: string;
};

export type CheckAccountResponse = {
  exist?: boolean;
  chatId?: string;
  username?: string;
  phoneNumber?: number;
  fromCache?: boolean;
  status?: boolean;
  reason?: string;
};

export type SendMessageResponse = {
  idMessage?: string;
};

export type ReceiveNotificationResponse = {
  receiptId: number;
  body: GreenApiWebhook;
};

export type GreenApiWebhook = {
  typeWebhook?: string;
  timestamp?: number;
  idMessage?: string;
  instanceData?: {
    idInstance?: number;
    wid?: string;
    typeInstance?: string;
  };
  senderData?: {
    chatId?: string;
    chatName?: string;
    sender?: string;
    senderName?: string;
    senderContactName?: string;
    senderPhoneNumber?: number;
    chatType?: string;
    senderType?: string;
  };
  messageData?: {
    typeMessage?: string;
    textMessageData?: {
      textMessage?: string;
    };
    extendedTextMessageData?: {
      text?: string;
    };
  };
};

export type DeleteNotificationResponse = {
  result?: boolean;
};

type GreenApiErrorPayload = {
  reason?: unknown;
  message?: unknown;
  error?: unknown;
  code?: unknown;
  status?: unknown;
};

const trimTrailingSlash = (value: string): string =>
  value.trim().replace(/\/+$/, "");

const buildUrl = (
  config: GreenApiConfig,
  method: string,
  suffix = "",
): string => {
  const apiUrl = trimTrailingSlash(config.apiUrl);

  return `${apiUrl}/waInstance${encodeURIComponent(
    config.idInstance,
  )}/${method}/${encodeURIComponent(config.apiTokenInstance)}${suffix}`;
};

const getErrorMessage = (payload: unknown, status: number): string => {
  if (typeof payload === "object" && payload !== null) {
    const data = payload as GreenApiErrorPayload;

    if (typeof data.reason === "string") return data.reason;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    if (typeof data.code === "string") return data.code;
  }

  return `GREEN-API request failed (${status})`;
};

const readJson = async (response: Response): Promise<unknown> => {
  const raw = await response.text();

  if (!raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`GREEN-API returned invalid JSON (${response.status})`);
  }
};

const requestJson = async <T>(
  responsePromise: Promise<Response>,
  validate?: (payload: unknown) => boolean,
): Promise<T> => {
  const response = await responsePromise;
  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  if (validate && !validate(payload)) {
    throw new Error("GREEN-API returned an unexpected response.");
  }

  return payload as T;
};

const postJson = async <T>(
  url: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> =>
  requestJson<T>(
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    }),
  );

export const greenApi = {
  async getState(
    config: GreenApiConfig,
    signal?: AbortSignal,
  ): Promise<GetStateResponse> {
    return requestJson<GetStateResponse>(
      fetch(buildUrl(config, "getStateInstance"), {
        method: "GET",
        signal,
      }),
    );
  },

  async checkAccount(
    config: GreenApiConfig,
    phoneNumber: number,
    signal?: AbortSignal,
  ): Promise<CheckAccountResponse> {
    return postJson<CheckAccountResponse>(
      buildUrl(config, "checkAccount"),
      {
        phoneNumber,
      },
      signal,
    );
  },

  async sendMessage(
    config: GreenApiConfig,
    chatId: string,
    message: string,
    signal?: AbortSignal,
  ): Promise<SendMessageResponse> {
    return postJson<SendMessageResponse>(
      buildUrl(config, "sendMessage"),
      {
        chatId,
        message,
      },
      signal,
    );
  },

  async receiveNotification(
    config: GreenApiConfig,
    receiveTimeout = 30,
    signal?: AbortSignal,
  ): Promise<ReceiveNotificationResponse | null> {
    const timeout = Math.min(60, Math.max(5, Math.floor(receiveTimeout)));

    const url = `${buildUrl(
      config,
      "receiveNotification",
    )}?receiveTimeout=${timeout}`;

    return requestJson<ReceiveNotificationResponse | null>(
      fetch(url, {
        method: "GET",
        signal,
      }),
      (payload: unknown): boolean =>
        payload === null ||
        (typeof payload === "object" &&
          payload !== null &&
          "receiptId" in payload &&
          "body" in payload),
    );
  },

  async deleteNotification(
    config: GreenApiConfig,
    receiptId: number,
    signal?: AbortSignal,
  ): Promise<DeleteNotificationResponse> {
    return requestJson<DeleteNotificationResponse>(
      fetch(
        buildUrl(
          config,
          "deleteNotification",
          `/${encodeURIComponent(String(receiptId))}`,
        ),
        {
          method: "DELETE",
          signal,
        },
      ),
    );
  },
};
