/* Fidel's push worker deliberately has no fetch handler or offline cache. */
self.addEventListener("push", (event) => {
  let message = {};
  try { message = event.data ? event.data.json() : {}; } catch { /* Show safe defaults. */ }
  const path = ["/Home", "/Learn", "/test"].includes(message.path) ? message.path : "/Home";
  event.waitUntil(self.registration.showNotification(
    typeof message.title === "string" ? message.title : "Fidel",
    { body: typeof message.body === "string" ? message.body : "A few words are waiting for you.", icon: "/fidel-icon-192.png", data: { path }, tag: "fidel-learning" },
  ));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.path || "/Home";
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(path);
        return client.focus();
      }
    }
    return clients.openWindow(path);
  })());
});
