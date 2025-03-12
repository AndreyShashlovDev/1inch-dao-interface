export class PublicProxyClient {
  host
  token
  get isAuth() {
    return true
  }
  constructor(host, token) {
    this.host = host
    this.token = token
  }
  async init() {}
  async get(url) {
    const response = await fetch(`${this.host}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
    })
    return await response.json()
  }
  async post(url, body) {
    const response = await fetch(`${this.host}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    })
    return await response.json()
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGljLXByb3h5LWNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInB1YmxpYy1wcm94eS1jbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsTUFBTSxPQUFPLGlCQUFpQjtJQU1UO0lBQ0E7SUFObkIsSUFBSSxNQUFNO1FBQ1IsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsWUFDbUIsSUFBWSxFQUNaLEtBQWM7UUFEZCxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQ1osVUFBSyxHQUFMLEtBQUssQ0FBUztJQUM5QixDQUFDO0lBRUosS0FBSyxDQUFDLElBQUksS0FBSSxDQUFDO0lBRWYsS0FBSyxDQUFDLEdBQUcsQ0FBSSxHQUFXO1FBQ3RCLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLEVBQUUsRUFBRTtZQUNqRCxNQUFNLEVBQUUsS0FBSztZQUNiLE9BQU8sRUFBRTtnQkFDUCxjQUFjLEVBQUUsa0JBQWtCO2dCQUNsQyxhQUFhLEVBQUUsVUFBVSxJQUFJLENBQUMsS0FBSyxFQUFFO2FBQ3RDO1NBQ0YsQ0FBQyxDQUFBO1FBQ0YsT0FBTyxNQUFNLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUM5QixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQUksQ0FBb0IsR0FBVyxFQUFFLElBQVU7UUFDbkQsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsRUFBRSxFQUFFO1lBQ2pELE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFO2dCQUNQLGNBQWMsRUFBRSxrQkFBa0I7Z0JBQ2xDLGFBQWEsRUFBRSxVQUFVLElBQUksQ0FBQyxLQUFLLEVBQUU7YUFDdEM7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7U0FDM0IsQ0FBQyxDQUFBO1FBQ0YsT0FBTyxNQUFNLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUM5QixDQUFDO0NBQ0YifQ==
