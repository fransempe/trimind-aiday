from langgraph.checkpoint.memory import InMemorySaver
from langgraph.checkpoint.serde.jsonplus import JsonPlusSerializer
from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from app.graph import nodes
from app.graph.state import GraphState

# Tipos que el checkpointer puede deserializar (LangGraph bloquea los no registrados).
ALLOWED_TYPES = [
    ("app.models.metrics", "AthleteSnapshot"),
    ("app.models.opinions", "AgentOpinion"),
    ("app.models.decision", "CoachDecision"),
    ("app.models.workout", "WorkoutCandidate"),
    ("app.models.rules", "RuleViolation"),
    ("app.graph.state", "RouteDecision"),
]


def fan_out(state: GraphState) -> list[Send]:
    return [
        Send(
            "specialist",
            {
                "agent": name,
                "snapshot": state["snapshot"],
                "run_id": state["run_id"],
                "question": state.get("question"),
            },
        )
        for name in state["route"].agents
    ]


def after_specialists(state: GraphState) -> str:
    return "head_coach" if state["mode"] == "daily" else "answer"


def build_graph(checkpointer=None):
    g = StateGraph(GraphState)
    g.add_node("router", nodes.router_node)
    g.add_node("specialist", nodes.specialist_node)
    g.add_node("head_coach", nodes.head_coach_node)
    g.add_node("rules", nodes.rules_node)
    g.add_node("approval", nodes.approval_node)
    g.add_node("finalize", nodes.finalize_node)
    g.add_node("answer", nodes.answer_node)

    g.add_edge(START, "router")
    g.add_conditional_edges("router", fan_out, ["specialist"])
    g.add_conditional_edges("specialist", after_specialists, ["head_coach", "answer"])
    g.add_edge("head_coach", "rules")
    g.add_conditional_edges("rules", nodes.after_rules, ["head_coach", "approval", "finalize"])
    g.add_edge("approval", "finalize")
    g.add_edge("finalize", END)
    g.add_edge("answer", END)
    # Checkpointer en memoria para el MVP; PostgresSaver en el paso 8.
    serde = JsonPlusSerializer(allowed_msgpack_modules=ALLOWED_TYPES)
    return g.compile(checkpointer=checkpointer or InMemorySaver(serde=serde))


graph = build_graph()
