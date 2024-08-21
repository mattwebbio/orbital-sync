import fetchCookie from 'fetch-cookie';
import { RequestInfo, RequestInit, Response } from 'node-fetch';

export type NodeFetchCookie = ReturnType<
  typeof fetchCookie<RequestInfo, RequestInit, Response>
>;
