# EasyDiet Pilot

Piloto funcional do EasyDiet: app mobile Expo, backend FastAPI com motor de precificacao e admin web Next.js.

## Estrutura

- `backend/`: API FastAPI, catalogo, pedidos em memoria e motor de pricing.
- `mobile/`: prototipo Expo/React Native com fluxo guiado de pedido.
- `admin/`: painel Next.js/Tailwind para pedidos, custos, margem, compras e etiquetas.

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Testes do motor financeiro:

```bash
cd backend
python -m unittest discover -s tests
```

## Mobile

```bash
cd mobile
npm install
npm run start
```

Configure `EXPO_PUBLIC_API_URL` se o backend nao estiver em `http://localhost:8000`.

## Admin

```bash
cd admin
npm install
npm run dev
```

Configure `NEXT_PUBLIC_API_URL` se o backend nao estiver em `http://localhost:8000`.

## Notas do piloto

- O pagamento e simulado.
- Os pedidos ficam em memoria para acelerar o piloto.
- A estrutura de banco, Alembic e modelos SQLAlchemy esta preparada para a proxima etapa.
- O cliente nunca recebe custo, lucro ou margem nas respostas publicas.
