import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch(
            "https://atendimento.chatguru.com.br/webhook/dashboard-atendimento-atualizacao",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            console.error(
                "Erro no webhook:",
                response.status,
                response.statusText
            );

            return NextResponse.json(
                {
                    success: false,
                    error: "Erro ao executar webhook",
                },
                {
                    status: response.status,
                }
            );
        }

        return NextResponse.json({
            success: true,
        });

    } catch (error) {
        console.error("Erro na rota atendimento-webhook:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Erro interno",
            },
            {
                status: 500,
            }
        );
    }
}