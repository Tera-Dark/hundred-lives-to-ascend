export const copy = (x) => JSON.parse(JSON.stringify(x));
export const round = (x) => Math.round(x * 100) / 100;
export const has = (items, id) => items.includes(id);
export function canSpend(l, c) {
  return (
    l.money >= (c.money || 0) &&
    l.herbs >= (c.herbs || 0) &&
    l.qi >= (c.qi || 0)
  );
}
export function charge(l, c) {
  l.money = round(l.money - (c.money || 0));
  l.herbs -= c.herbs || 0;
  l.qi = round(l.qi - (c.qi || 0));
}
