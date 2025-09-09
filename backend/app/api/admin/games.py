from fastapi import APIRouter, UploadFile, Form, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_write_session, get_read_session
from app.db.models.invitation import Game
from app.services.s3.presentation_image import PresentationImageService
from app.core.permissions import is_admin_authenticated

router = APIRouter()
templates = Jinja2Templates(directory="app/templates/admin/games")

# -------------------- List --------------------
@router.get("/")
async def list_games(db: AsyncSession = Depends(get_read_session), admin=Depends(is_admin_authenticated)):
    result = await db.execute(select(Game).order_by(Game.name))
    games = result.scalars().all()
    return templates.TemplateResponse("list.html", {"request": {}, "games": games})

# -------------------- Create / Update Helper --------------------
async def handle_game_upload(db, name: str, key: str, file: UploadFile | None, instance_id: int | None = None):
    service = PresentationImageService()
    if instance_id:
        instance = await db.get(Game, instance_id)
        if not instance:
            raise HTTPException(404, "Game not found")
        instance.name = name
        instance.key = key
    else:
        instance = Game(name=name, key=key)

    if file and file.filename:
        if instance_id and getattr(instance, "presentation_image", None):
            try:
                await service.delete_image(instance.presentation_image)
            except Exception as e:
                print("Failed to delete old image:", e)
        instance.presentation_image = await service.upload_image(file)

    db.add(instance)
    await db.commit()
    return instance


# -------------------- New Form --------------------
@router.get("/new")
async def new_game_form(admin=Depends(is_admin_authenticated)):
    """
    Render the form to create a new game.
    """
    return templates.TemplateResponse("new.html", {"request": {}})

# -------------------- Create --------------------
@router.post("/new")
async def create_game(
    name: str = Form(...),
    key: str = Form(...),
    presentation_image: UploadFile = None,
    db: AsyncSession = Depends(get_write_session),
    admin=Depends(is_admin_authenticated),
):
    await handle_game_upload(db, name, key, presentation_image)
    return RedirectResponse(url="/admin/games/", status_code=303)

# -------------------- Edit --------------------
@router.get("/{game_id}/edit")
async def edit_game_form(
    game_id: int,
    db: AsyncSession = Depends(get_read_session),
    admin=Depends(is_admin_authenticated)
):
    game = await db.get(Game, game_id)
    if not game:
        return RedirectResponse(url="/admin/games/", status_code=303)
    return templates.TemplateResponse(
        "edit.html",
        {"request": {}, "game": game}
    )

@router.post("/{game_id}/edit")
async def update_game(
    game_id: int,
    name: str = Form(...),
    key: str = Form(...),
    presentation_image: UploadFile = None,
    db: AsyncSession = Depends(get_write_session),
    admin=Depends(is_admin_authenticated),
):
    await handle_game_upload(db, name, key, presentation_image, instance_id=game_id)
    return RedirectResponse(url="/admin/games/", status_code=303)

# -------------------- Delete --------------------
@router.post("/{game_id}/delete")
async def delete_game(
    game_id: int,
    db: AsyncSession = Depends(get_write_session),
    admin=Depends(is_admin_authenticated),
):
    game = await db.get(Game, game_id)
    if not game:
        return RedirectResponse(url="/admin/games/", status_code=303)

    service = PresentationImageService()
    if getattr(game, "presentation_image", None):
        try:
            await service.delete_image(game.presentation_image)
        except Exception as e:
            print("Failed to delete image:", e)

    await db.delete(game)
    await db.commit()
    return RedirectResponse(url="/admin/games/", status_code=303)
