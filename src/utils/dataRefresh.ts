export const DATA_CHANGED_EVENT = "school-control:data-changed";

/**
 * Сообщает открытым разделам, что серверные данные изменились.
 * Слушатели обновляют их в фоне, не включая экранные лоадеры.
 */
export const notifyDataChanged = () => {
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
};
